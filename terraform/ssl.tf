# ===================================================================
# ACM CERTIFICATE & ROUTE 53 DNS
# ===================================================================

# ACM Certificate (only if domain is provided and HTTPS is enabled)
resource "aws_acm_certificate" "vouch" {
  count          = var.enable_https && var.domain_name != "" ? 1 : 0
  domain_name    = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "www.${var.domain_name}"
  ]
  
  tags = merge(local.common_tags, {
    Name = "${var.app_name}-certificate"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# Get hosted zone for domain
data "aws_route53_zone" "selected" {
  count        = var.enable_https && var.domain_name != "" ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "cert_validation" {
  count   = var.enable_https && var.domain_name != "" ? 2 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = aws_acm_certificate.vouch[0].domain_validation_options[count.index].resource_record_name
  type    = aws_acm_certificate.vouch[0].domain_validation_options[count.index].resource_record_type
  records = [aws_acm_certificate.vouch[0].domain_validation_options[count.index].resource_record_value]
  ttl     = 60
}

# Certificate validation
resource "aws_acm_certificate_validation" "vouch" {
  count                   = var.enable_https && var.domain_name != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.vouch[0].arn
  validation_record_fqdns = aws_route53_record.cert_validation[*].fqdn
}

# Route 53 A record for the application
resource "aws_route53_record" "vouch" {
  count   = var.enable_https && var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.vouch.dns_name
    zone_id               = aws_lb.vouch.zone_id
    evaluate_target_health = true
  }
}

# Route 53 A record for www subdomain
resource "aws_route53_record" "vouch_www" {
  count   = var.enable_https && var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_lb.vouch.dns_name
    zone_id               = aws_lb.vouch.zone_id
    evaluate_target_health = true
  }
}
