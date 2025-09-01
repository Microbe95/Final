# ============================================================================
# 🧮 Calculation Entity - CBAM 계산 데이터 모델
# ============================================================================

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, BigInteger, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, Any, List
from decimal import Decimal

# 공통 Base 클래스 사용
from app.common.database_base import Base

# ============================================================================
# 📊 ProcessAttrdirEmission 엔티티 (공정별 직접귀속배출량)
# ============================================================================

class ProcessAttrdirEmission(Base):
    """공정별 직접귀속배출량 엔티티"""
    
    __tablename__ = "process_attrdir_emission"
    
    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("process.id", ondelete="CASCADE"), nullable=False, index=True)
    total_matdir_emission = Column(Numeric(15, 6), nullable=False, default=0, comment="총 원료직접배출량")
    total_fueldir_emission = Column(Numeric(15, 6), nullable=False, default=0, comment="총 연료직접배출량")
    attrdir_em = Column(Numeric(15, 6), nullable=False, default=0, comment="직접귀속배출량 (원료+연료)")
    calculation_date = Column(DateTime, default=datetime.now, comment="계산 일시")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """엔티티를 딕셔너리로 변환"""
        return {
            "id": self.id,
            "process_id": self.process_id,
            "total_matdir_emission": float(self.total_matdir_emission) if self.total_matdir_emission else 0.0,
            "total_fueldir_emission": float(self.total_fueldir_emission) if self.total_fueldir_emission else 0.0,
            "attrdir_em": float(self.attrdir_em) if self.attrdir_em else 0.0,
            "calculation_date": self.calculation_date.isoformat() if self.calculation_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ProcessAttrdirEmission":
        """딕셔너리에서 엔티티 생성"""
        return cls(
            process_id=data.get("process_id"),
            total_matdir_emission=data.get("total_matdir_emission", 0.0),
            total_fueldir_emission=data.get("total_fueldir_emission", 0.0),
            attrdir_em=data.get("attrdir_em", 0.0),
            calculation_date=datetime.fromisoformat(data.get("calculation_date")) if data.get("calculation_date") else datetime.now()
        )
    
    def __repr__(self):
        return f"<ProcessAttrdirEmission(id={self.id}, process_id={self.process_id}, attrdir_em={self.attrdir_em})>"