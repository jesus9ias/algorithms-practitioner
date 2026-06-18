import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";

import { InfraConfig } from "./config";
import { RESOURCE_ID, OUTPUT_KEY, SITE_CONFIG, HTTPS_PREFIX } from "./constants";

export interface AlgoDsaStackProps extends StackProps {
  readonly config: InfraConfig;
}

/**
 * Hosting stack for the static frontend.
 *
 * - Private, versioned S3 bucket (no public access).
 * - CloudFront distribution with Origin Access Control (OAC), HTTPS-only.
 * - SPA-style 404 handling (404 -> 404.html served with HTTP 200).
 * - Route 53 A + AAAA alias records pointing the subdomain at CloudFront.
 * - ACM certificate created and DNS-validated by CDK (must live in us-east-1 for CloudFront).
 */
export class AlgoDsaStack extends Stack {
  constructor(scope: Construct, id: string, props: AlgoDsaStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Private, versioned bucket. No public access; CloudFront reads via OAC.
    const siteBucket = new s3.Bucket(this, RESOURCE_ID.SITE_BUCKET, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Existing hosted zone for the apex domain (looked up early for cert validation).
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      RESOURCE_ID.HOSTED_ZONE,
      {
        hostedZoneId: config.hostedZoneId,
        zoneName: config.hostedZoneName,
      }
    );

    // ACM certificate created and DNS-validated by CDK against the hosted zone.
    // Must be in us-east-1 (stack constraint) for CloudFront to accept it.
    const certificate = new acm.Certificate(this, RESOURCE_ID.CERTIFICATE, {
      domainName: config.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // CloudFront distribution with OAC against the private bucket.
    const distribution = new cloudfront.Distribution(this, RESOURCE_ID.DISTRIBUTION, {
      defaultRootObject: SITE_CONFIG.DEFAULT_ROOT_OBJECT,
      domainNames: [config.domainName],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: SITE_CONFIG.HTTP_NOT_FOUND,
          responseHttpStatus: SITE_CONFIG.HTTP_OK,
          responsePagePath: `/${SITE_CONFIG.ERROR_DOCUMENT}`,
          ttl: Duration.seconds(SITE_CONFIG.ERROR_RESPONSE_TTL_SECONDS),
        },
      ],
    });

    const aliasTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution)
    );

    new route53.ARecord(this, RESOURCE_ID.A_RECORD, {
      zone: hostedZone,
      recordName: config.domainName,
      target: aliasTarget,
    });

    new route53.AaaaRecord(this, RESOURCE_ID.AAAA_RECORD, {
      zone: hostedZone,
      recordName: config.domainName,
      target: aliasTarget,
    });

    new CfnOutput(this, OUTPUT_KEY.BUCKET_NAME, { value: siteBucket.bucketName });
    new CfnOutput(this, OUTPUT_KEY.DISTRIBUTION_ID, { value: distribution.distributionId });
    new CfnOutput(this, OUTPUT_KEY.DISTRIBUTION_DOMAIN, {
      value: distribution.distributionDomainName,
    });
    new CfnOutput(this, OUTPUT_KEY.SITE_URL, {
      value: `${HTTPS_PREFIX}${config.domainName}`,
    });
  }
}
