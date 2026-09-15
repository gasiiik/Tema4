from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import json

class Role(Base):
    __tablename__ = "roles"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    _permissions = Column("permissions", Text, nullable=False) # uloženo jako JSON text

    @property
    def permissions(self):
        return json.loads(self._permissions)

    @permissions.setter
    def permissions(self, value):
        self._permissions = json.dumps(value)

class User(Base):
    __tablename__ = "users"
    username = Column(String(50), primary_key=True, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role_id = Column(String(50), ForeignKey("roles.id"), nullable=False)

    role = relationship("Role")

class Part(Base):
    __tablename__ = "parts"
    serial_number = Column(String(100), primary_key=True, index=True)
    part_type = Column(String(255), nullable=False)
    parameters = Column(Text, nullable=True)
    source_equipment = Column(String(255), nullable=True)
    created_by_user = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    history = relationship("PartHistory", back_populates="part", order_by="desc(PartHistory.date)")
    photos = relationship("PartPhoto", back_populates="part")

class PartHistory(Base):
    __tablename__ = "part_history"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(String(100), ForeignKey("parts.serial_number"))
    action = Column(String(100), nullable=False)
    user = Column(String(100), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    _details = Column("details", Text, nullable=True)

    part = relationship("Part", back_populates="history")
    photos = relationship("HistoryPhoto", back_populates="history")

    @property
    def details(self):
        return json.loads(self._details) if self._details else {}

    @details.setter
    def details(self, value):
        self._details = json.dumps(value) if value else None

class PartPhoto(Base):
    __tablename__ = "part_photos"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(String(100), ForeignKey("parts.serial_number"))
    url = Column(String(255), nullable=False)

    part = relationship("Part", back_populates="photos")

class HistoryPhoto(Base):
    __tablename__ = "history_photos"
    id = Column(Integer, primary_key=True, index=True)
    history_id = Column(Integer, ForeignKey("part_history.id"))
    url = Column(String(255), nullable=False)

    history = relationship("PartHistory", back_populates="photos")
