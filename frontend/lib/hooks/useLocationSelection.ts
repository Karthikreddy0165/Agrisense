'use client';

import { useState, useEffect } from 'react';
import type { State, District, Mandi } from '../types/geography.types';
import { getStates, getDistricts, getMandis } from '../services/geography.service';

export function useLocationSelection(initialStateId?: string, initialDistrictId?: string, initialMandiId?: string) {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mandis, setMandis] = useState<Mandi[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<string>(initialStateId ?? '');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialDistrictId ?? '');
  const [selectedMandiId, setSelectedMandiId] = useState<string>(initialMandiId ?? '');

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMandis, setLoadingMandis] = useState(false);

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (!selectedStateId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setMandis([]);
      setSelectedMandiId('');
      return;
    }
    setLoadingDistricts(true);
    getDistricts(selectedStateId).then((d) => {
      setDistricts(d);
      setLoadingDistricts(false);
    });
    setSelectedDistrictId('');
    setMandis([]);
    setSelectedMandiId('');
  }, [selectedStateId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setMandis([]);
      setSelectedMandiId('');
      return;
    }
    setLoadingMandis(true);
    getMandis(selectedDistrictId).then((m) => {
      setMandis(m);
      setLoadingMandis(false);
    });
    setSelectedMandiId('');
  }, [selectedDistrictId]);

  const selectState = (stateId: string) => setSelectedStateId(stateId);
  const selectDistrict = (districtId: string) => setSelectedDistrictId(districtId);
  const selectMandi = (mandiId: string) => setSelectedMandiId(mandiId);

  const selectedState = states.find((s) => s.id === selectedStateId) ?? null;
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId) ?? null;
  const selectedMandi = mandis.find((m) => m.id === selectedMandiId) ?? null;

  return {
    states, districts, mandis,
    selectedStateId, selectedDistrictId, selectedMandiId,
    selectedState, selectedDistrict, selectedMandi,
    selectState, selectDistrict, selectMandi,
    loadingDistricts, loadingMandis,
  };
}
