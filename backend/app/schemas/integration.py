from app.schemas.common import ApiModel


class IntegrationStatusItem(ApiModel):
    name: str
    status: str
    mode: str
    detail: str
    required_for_production: bool = False


class IntegrationsStatusRead(ApiModel):
    app_env: str
    overall_status: str
    integrations: list[IntegrationStatusItem]
