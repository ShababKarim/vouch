# ===================================================================
# AWS SECRETS MANAGER
# ===================================================================

# Generate JWT secret if not provided
resource "random_password" "jwt_secret" {
  count   = var.jwt_secret == "" ? 1 : 0
  length  = 32
  special = false
}

# Main application secret
resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.app_name}/${var.environment}"
  description             = "Application secrets for ${var.app_name} in ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-secrets"
  })
}

# Secret values
resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  
  secret_string = jsonencode({
    # Database configuration
    DATABASE_URL = "postgresql://vouch:${random_password.db_password.result}@${aws_db_instance.vouch.endpoint}:5432/vouch"
    
    # JWT configuration
    JWT_SECRET = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
    JWT_EXPIRY_HOURS = "168"
    
    # Environment configuration
    NODE_ENV = var.environment
    NEXT_PUBLIC_APP_URL = var.enable_https && var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.vouch.dns_name}"
    
    # Twilio configuration (if provided)
    TWILIO_ACCOUNT_SID = var.twilio_config != null ? var.twilio_config.account_sid : ""
    TWILIO_AUTH_TOKEN = var.twilio_config != null ? var.twilio_config.auth_token : ""
    TWILIO_VERIFY_SERVICE_SID = var.twilio_config != null ? var.twilio_config.verify_service_sid : ""
    TWILIO_PHONE_NUMBER = var.twilio_config != null ? var.twilio_config.phone_number : ""
    
    # AWS S3 configuration
    AWS_ACCESS_KEY_ID = "" # Will be provided by IAM role
    AWS_SECRET_ACCESS_KEY = "" # Will be provided by IAM role
    AWS_REGION = var.aws_region
    S3_BUCKET_NAME = aws_s3_bucket.uploads.id
  })
}

# Secret for database credentials (separate for rotation)
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.app_name}/${var.environment}/db"
  description             = "Database credentials for ${var.app_name} in ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-secrets"
    Type = "database"
  })
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  
  secret_string = jsonencode({
    username = "vouch"
    password = random_password.db_password.result
    host     = aws_db_instance.vouch.endpoint
    port     = 5432
    dbname   = "vouch"
  })
}
