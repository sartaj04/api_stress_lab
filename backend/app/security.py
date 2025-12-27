import re
import socket
import ipaddress
from urllib.parse import urlparse
from fastapi import HTTPException


# Private IP ranges to block
BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),  # Carrier-grade NAT
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),  # Multicast
    ipaddress.ip_network("240.0.0.0/4"),  # Reserved
]

# Blocked hostnames
BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "metadata.google.internal",
    "metadata.goog",
}


def is_ip_blocked(ip: str) -> bool:
    """Check if an IP address is in a blocked range."""
    try:
        ip_obj = ipaddress.ip_address(ip)
        for network in BLOCKED_IP_RANGES:
            if ip_obj in network:
                return True
        return False
    except ValueError:
        return True  # Invalid IP, block it


def validate_url(url: str) -> str:
    """Validate and sanitize a URL to prevent SSRF attacks."""
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Parse the URL
    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")
    
    # Only allow http and https
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only HTTP and HTTPS URLs are allowed")
    
    # Get hostname
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="URL must have a valid hostname")
    
    # Check blocked hostnames
    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise HTTPException(status_code=400, detail="This hostname is not allowed")
    
    # Check for metadata service patterns
    if "metadata" in hostname_lower or "169.254" in hostname_lower:
        raise HTTPException(status_code=400, detail="Access to metadata services is not allowed")
    
    # Try to resolve as IP directly
    try:
        ip = ipaddress.ip_address(hostname)
        if is_ip_blocked(str(ip)):
            raise HTTPException(status_code=400, detail="Access to private IP addresses is not allowed")
    except ValueError:
        # It's a hostname, resolve it
        try:
            resolved_ips = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            for family, type_, proto, canonname, sockaddr in resolved_ips:
                ip = sockaddr[0]
                if is_ip_blocked(ip):
                    raise HTTPException(
                        status_code=400, 
                        detail="URL resolves to a private IP address, which is not allowed"
                    )
        except socket.gaierror:
            # Can't resolve, might be a valid external hostname
            pass
    
    return url


def validate_base_url(url: str) -> str:
    """Validate a base URL for API testing."""
    url = validate_url(url)
    
    # Ensure it doesn't end with a slash
    return url.rstrip("/")
