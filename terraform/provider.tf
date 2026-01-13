provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "vouch"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Configure backend for state management
# Uncomment and configure for production use
# terraform {
#   backend "s3" {
#     bucket         = "vouch-terraform-state"
#     key            = "terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "vouch-terraform-locks"
#   }
# }
