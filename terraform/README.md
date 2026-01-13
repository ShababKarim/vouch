# Vouch Terraform Infrastructure

This Terraform configuration deploys the complete AWS infrastructure for the Vouch application based on the engineering requirements document.

## Architecture Overview

The infrastructure includes:

- **ECS Fargate**: Container orchestration for the Next.js application
- **RDS PostgreSQL**: t3.micro instance for the database
- **S3**: File storage for uploads with public read access
- **Application Load Balancer**: HTTPS-enabled load balancer with SSL termination
- **Secrets Manager**: Secure storage for application secrets
- **ECR**: Docker image repository
- **Route 53**: DNS management (optional, with custom domain)
- **CloudWatch**: Logging and monitoring

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.5.0 installed
3. **AWS CLI** configured with credentials
4. **Domain name** (optional, for HTTPS)

## Quick Start

### 1. Clone and Navigate

```bash
cd terraform
```

### 2. Create Terraform Variables

Create a `terraform.tfvars` file:

```hcl
# Required variables
aws_region  = "us-east-1"
environment = "production"

# Optional variables (uncomment and configure as needed)
# domain_name = "vouch.yourdomain.com"
# enable_https = true

# Twilio configuration (required for production)
twilio_config = {
  account_sid        = "your-twilio-account-sid"
  auth_token         = "your-twilio-auth-token"
  verify_service_sid = "your-twilio-verify-sid"
  phone_number       = "+1234567890"
}

# JWT secret (optional - will be generated if not provided)
# jwt_secret = "your-32-character-secret-key"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan and Deploy

```bash
# Review the plan
terraform plan

# Deploy the infrastructure
terraform apply
```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region | `us-east-1` | Yes |
| `environment` | Environment name | `production` | Yes |
| `domain_name` | Custom domain (e.g., vouch.yourdomain.com) | `""` | No |
| `enable_https` | Enable HTTPS with SSL certificate | `true` | No |
| `twilio_config` | Twilio configuration object | `null` | Yes (production) |
| `jwt_secret` | JWT secret (min 32 chars) | `""` | No (generated) |

### Twilio Configuration

For production deployment, you must provide Twilio credentials:

```hcl
twilio_config = {
  account_sid        = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  auth_token         = "your_auth_token"
  verify_service_sid = "VAXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  phone_number       = "+1234567890"
}
```

## Deployment Steps

### 1. Build and Push Docker Image

After Terraform deployment, build and push your Docker image:

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build production image
docker build -t vouch --target runner .

# Tag and push
docker tag vouch:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vouch:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vouch:latest
```

### 2. Update ECS Service

Force a new deployment to use the new image:

```bash
aws ecs update-service --cluster vouch-cluster --service vouch-service --force-new-deployment
```

### 3. Run Database Migrations

Connect to your RDS instance and run migrations:

```bash
# Get database credentials from Secrets Manager
aws secretsmanager get-secret-value --secret-id vouch/production

# Run migrations (from your local machine with DATABASE_URL set)
npx prisma migrate deploy
```

## Security Features

- **Encryption**: RDS and S3 encryption enabled
- **Network Isolation**: Private subnets for database, public for ALB
- **Secrets Management**: All secrets stored in AWS Secrets Manager
- **IAM Roles**: Least-privilege access for ECS tasks
- **SSL/TLS**: Automatic HTTPS with valid certificates
- **Access Logs**: ALB access logs stored in S3

## Monitoring and Logging

- **CloudWatch Logs**: Container logs automatically collected
- **CloudWatch Metrics**: ECS and RDS metrics
- **Health Checks**: Application and target group health checks
- **ALB Access Logs**: HTTP request logs stored in S3

## Cost Optimization

- **RDS**: t3.micro instance (Free Tier eligible)
- **ECS**: Fargate with 0.25 vCPU, 0.5 GB RAM
- **S3**: Lifecycle policies for log rotation
- **Data Transfer**: Optimized for expected traffic patterns

## Troubleshooting

### Common Issues

1. **ECS Service Not Starting**
   - Check task definition and secrets
   - Verify ECR image exists and is accessible
   - Review CloudWatch logs for error details

2. **Database Connection Issues**
   - Verify security group allows ECS to RDS traffic
   - Check database credentials in Secrets Manager
   - Ensure database is in available state

3. **SSL Certificate Issues**
   - Verify Route 53 DNS records are created
   - Check certificate validation status
   - Ensure domain name is correctly configured

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster vouch-cluster --services vouch-service

# View container logs
aws logs tail /ecs/vouch --follow

# Check ALB target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Get RDS status
aws rds describe-db-instances --db-instance-identifier vouch-db
```

## Maintenance

### Updates

1. **Application Updates**: Build and push new Docker image, then update ECS service
2. **Infrastructure Changes**: Modify Terraform code and run `terraform apply`
3. **Database Updates**: Run Prisma migrations as needed

### Backups

- **RDS**: Automatic daily backups with 7-day retention
- **S3**: Versioning enabled for upload bucket
- **Terraform State**: Configure remote backend for production

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete all resources including the database and its data.

## Support

If you encounter issues:

1. Check the AWS Console for resource status
2. Review CloudWatch logs for error messages
3. Verify IAM permissions are sufficient
4. Consult the engineering requirements document for detailed specifications
