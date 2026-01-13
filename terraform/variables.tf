variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the application (e.g., vouch.yourdomain.com)"
  type        = string
  default     = ""
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "vouch"
}

variable "vpc_id" {
  description = "VPC ID to deploy resources in. If empty, uses default VPC"
  type        = string
  default     = ""
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs. If empty, uses default subnets"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS. If empty, creates private subnets"
  type        = list(string)
  default     = []
}

variable "enable_https" {
  description = "Enable HTTPS with SSL certificate"
  type        = bool
  default     = true
}

variable "twilio_config" {
  description = "Twilio configuration"
  type = object({
    account_sid          = string
    auth_token           = string
    verify_service_sid   = string
    phone_number         = string
  })
  default = null
  sensitive = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication (min 32 characters)"
  type        = string
  default     = ""
  sensitive   = true
}
