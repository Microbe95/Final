# ============================================================================
# 📦 Calculation Domain - CBAM 계산 도메인
# ============================================================================

"""
CBAM 계산 도메인 패키지

이 패키지는 CBAM(Carbon Border Adjustment Mechanism) 계산과 관련된
모든 비즈니스 로직을 포함합니다.

주요 기능:
- 프로세스 관리 (Process)
- CBAM 종합 계산
- 계산 통계
"""

from app.domain.calculation.calculation_entity import (
    ProductProcess,  # 새로운 중간 테이블 엔티티
)

from app.domain.calculation.calculation_schema import (
    # ProductProcess 관련 스키마
    ProductProcessCreateRequest,
    ProductProcessResponse,
)

from app.domain.calculation.calculation_repository import CalculationRepository
from app.domain.calculation.calculation_service import CalculationService
from app.domain.calculation.calculation_controller import calculation_router

__all__ = [
    # 엔티티
    "ProductProcess",
    
    # 스키마
    "ProductProcessCreateRequest",
    "ProductProcessResponse",
    
    # 서비스 및 컨트롤러
    "CalculationRepository",
    "CalculationService", 
    "calculation_router",
]