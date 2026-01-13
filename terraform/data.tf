# Get default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default public subnets
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

data "aws_subnet" "public_a" {
  id = data.aws_subnets.public.ids[0]
}

data "aws_subnet" "public_b" {
  id = data.aws_subnets.public.ids[1]
}

data "aws_subnet" "public_c" {
  id = data.aws_subnets.public.ids[2]
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get AWS region
data "aws_region" "current" {}

# Random suffix for unique naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Random password for RDS if not provided
resource "random_password" "db_password" {
  length  = 32
  special = true
}
