# IPFS Explorer

![ipfs-explorer Icon](../screenshots/ipfs-explorer-icon.png)

## Description
Explore and manage IPFS content with collaborative features

## Screenshots
- **Icon**: ![Icon](../screenshots/ipfs-explorer-icon.png)
- **Application Window**: ![Window](../screenshots/ipfs-explorer-window.png)

## Features
- Content browsing
- Pin management
- Peer discovery
- Content sharing

## Backend Dependencies
- **IPFS node**: Core dependency for application functionality
- **Content discovery**: Core dependency for application functionality
- **Pinning service**: Core dependency for application functionality
- **Gateway access**: Core dependency for application functionality

## Development Considerations
This application requires the following backend services to be operational:
- [ ] IPFS node
- [ ] Content discovery
- [ ] Pinning service
- [ ] Gateway access

## Integration Points
- **Frontend Component**: `web/js/apps/ipfs-explorer.js`
- **Desktop Integration**: Application icon selector `[data-app="ipfs-explorer"]`
- **Icon**: 🌐
- **Registered Application**: ✅ Yes

## Parallel Development Strategy
To enable parallel frontend and backend development:

1. **Mock Backend Services**: Create mock implementations of required backend dependencies
2. **API Contracts**: Define clear API contracts for all backend services
3. **Testing Strategy**: Implement comprehensive testing for both frontend and backend components
4. **Documentation**: Maintain up-to-date documentation of all dependencies and their interactions

---
*Generated automatically by SwissKnife documentation system*
