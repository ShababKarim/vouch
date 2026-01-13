# ===================================================================
# AMAZON RDS - PostgreSQL Database
# ===================================================================

# Subnet group for RDS
resource "aws_db_subnet_group" "vouch" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = local.private_subnet_ids
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db-subnet-group"
  })
}

# RDS PostgreSQL instance
resource "aws_db_instance" "vouch" {
  identifier = "${var.app_name}-db"
  
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "vouch"
  username = "vouch"
  password = random_password.db_password.result
  
  db_subnet_group_name   = aws_db_subnet_group.vouch.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  delete_automated_backups  = false
  
  # Performance insights for monitoring
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  
  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Deletion protection (disable for development)
  deletion_protection = var.environment == "production" ? true : false
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-db"
  })
}

# IAM role for enhanced monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.app_name}-rds-enhanced-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
