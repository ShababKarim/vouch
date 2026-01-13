locals {
  # Generate unique suffix for S3 bucket to avoid naming conflicts
  unique_suffix = random_id.bucket_suffix.hex
  
  # Default to using default VPC if not specified
  vpc_id = var.vpc_id != "" ? var.vpc_id : data.aws_vpc.default.id
  
  # Use provided subnets or get default subnets
  public_subnet_ids = length(var.public_subnet_ids) > 0 ? var.public_subnet_ids : [
    data.aws_subnet.public_a.id,
    data.aws_subnet.public_b.id,
    data.aws_subnet.public_c.id
  ]
  
  # Create private subnets for RDS if not provided
  private_subnet_ids = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids : [
    aws_subnet.private_a[0].id,
    aws_subnet.private_b[0].id
  ]
  
  # Common tags
  common_tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  # Container configuration
  container_name = "${var.app_name}-container"
  container_port = 3000
  
  # Health check path
  health_check_path = "/api/health"
}
