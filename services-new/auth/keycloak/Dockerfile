FROM quay.io/keycloak/keycloak:23.0.7

USER root
RUN microdnf install -y curl && microdnf clean all
USER 1000

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
