# File Manager

![file-manager Icon](../screenshots/file-manager-icon.png)

## Description
Professional file manager with IPFS integration and collaborative features

## Screenshots
- **Icon**: ![Icon](../screenshots/file-manager-icon.png)
- **Application Window**: ![Window](../screenshots/file-manager-window.png)

## Features
- IPFS integration
- Collaborative editing
- Version control
- Distributed storage

## Backend Dependencies
- **File system API**: Core dependency for application functionality
- **IPFS network**: Core dependency for application functionality
- **P2P file sharing**: Core dependency for application functionality
- **Version control**: Core dependency for application functionality

## Development Considerations
This application requires the following backend services to be operational:
- [ ] File system API
- [ ] IPFS network
- [ ] P2P file sharing
- [ ] Version control

## Integration Points
- **Frontend Component**: `web/js/apps/file-manager.js`
- **Desktop Integration**: Application icon selector `[data-app="file-manager"]`
- **Icon**: 📁
- **Registered Application**: ✅ Yes

## Parallel Development Strategy
To enable parallel frontend and backend development:

1. **Mock Backend Services**: Create mock implementations of required backend dependencies
2. **API Contracts**: Define clear API contracts for all backend services
3. **Testing Strategy**: Implement comprehensive testing for both frontend and backend components
4. **Documentation**: Maintain up-to-date documentation of all dependencies and their interactions

---
*Generated automatically by SwissKnife documentation system*
