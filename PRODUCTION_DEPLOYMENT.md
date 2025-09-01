# SwissKnife Production Deployment Guide

This guide covers deploying SwissKnife in production environments with high availability, security, and performance optimizations.

## Quick Start

### Docker Deployment (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access the virtual desktop
open http://localhost:3001
```

### Manual Deployment

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build all components
npm run build:all

# Run production server
NODE_ENV=production npm run desktop
```

## Deployment Options

### 1. Docker Container

**Single Container:**
```bash
npm run docker:build
npm run docker:run
```

**With Docker Compose:**
```bash
docker-compose up -d swissknife
```

### 2. Static Hosting

Build static assets for CDN deployment:
```bash
npm run build:web
# Deploy web/dist/ to your static hosting provider
```

### 3. Node.js Server

```bash
npm run build:all
NODE_ENV=production npm start
```

### 4. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: swissknife
spec:
  replicas: 3
  selector:
    matchLabels:
      app: swissknife
  template:
    metadata:
      labels:
        app: swissknife
    spec:
      containers:
      - name: swissknife
        image: hallucinate-llc/swissknife:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run analyze

# Run performance tests
npm run performance-test

# Optimize build
npm run optimize
```

### Production Configuration

Create `.env.production`:
```bash
NODE_ENV=production
SWISSKNIFE_HOST=0.0.0.0
SWISSKNIFE_PORT=3001
SWISSKNIFE_LOG_LEVEL=warn
SWISSKNIFE_CACHE_ENABLED=true
SWISSKNIFE_COMPRESSION=true
```

## Security

### Security Audit

```bash
# Run security checks
npm run security-audit

# Check for vulnerabilities
npm run test:security
```

### Production Security

1. **Environment Variables**: Store sensitive data in environment variables
2. **HTTPS**: Use TLS certificates in production
3. **Content Security Policy**: Configure CSP headers
4. **Rate Limiting**: Implement API rate limiting
5. **Authentication**: Add user authentication if needed

### Recommended Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Monitoring

### Health Checks

SwissKnife includes built-in health check endpoints:

- `GET /health` - Basic health status
- `GET /metrics` - Performance metrics
- `GET /status` - Detailed system status

### Logging

Configure structured logging:
```bash
export SWISSKNIFE_LOG_LEVEL=info
export SWISSKNIFE_LOG_FORMAT=json
```

### Monitoring Setup

```bash
# Prometheus metrics endpoint
curl http://localhost:3001/metrics

# Application logs
docker logs swissknife
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  swissknife:
    deploy:
      replicas: 3
    labels:
      - "traefik.http.services.swissknife.loadbalancer.sticky.cookie=true"
```

### Load Balancing

Use Traefik, nginx, or HAProxy for load balancing multiple instances.

## Backup and Recovery

### Data Backup

```bash
# Backup configuration and data
docker run --rm -v swissknife-data:/data -v $(pwd):/backup alpine tar czf /backup/swissknife-backup.tar.gz /data
```

### Recovery

```bash
# Restore from backup
docker run --rm -v swissknife-data:/data -v $(pwd):/backup alpine tar xzf /backup/swissknife-backup.tar.gz -C /
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 3001 is available
2. **Memory issues**: Increase container memory limits
3. **Build failures**: Check Node.js version compatibility
4. **Network issues**: Verify firewall and proxy settings

### Debug Mode

```bash
DEBUG=swissknife:* npm run desktop
```

### Log Analysis

```bash
# Real-time logs
docker-compose logs -f swissknife

# Error logs only
docker-compose logs swissknife | grep ERROR
```

## Production Checklist

- [ ] Run security audit: `npm run security-audit`
- [ ] Run performance tests: `npm run performance-test`
- [ ] Configure environment variables
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Test disaster recovery
- [ ] Set up CI/CD pipeline
- [ ] Configure SSL certificates
- [ ] Review security headers
- [ ] Test load balancing
- [ ] Document deployment procedures

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci --legacy-peer-deps
    
    - name: Run tests
      run: npm run test:production
    
    - name: Build
      run: npm run build:all
    
    - name: Build Docker image
      run: npm run docker:build
    
    - name: Deploy
      run: npm run docker:push
```

## Support

For production support and enterprise deployments:

- GitHub Issues: https://github.com/hallucinate-llc/swissknife/issues
- Documentation: https://github.com/hallucinate-llc/swissknife/docs
- Community: SwissKnife Discord/Slack

## License

Production deployments must comply with the project license terms.