#!/usr/bin/env node
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../lib/dataLab/pool.mjs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * REALISTIC Water Delivery Demo from Actual Pakistan Plant Register
 * 
 * Based on real register entries (Date: 3/1/26, 1/3/26, 1/3/26):
 * - Multiple routes: DHA (P1, P2), Clifton (11-B), Bahria Town (P.26, P.27, P.91), Gulshan (10-B)
 * - Account codes with town blocks (P1-927, P2-420, 11B-90, etc.)
 * - Daily DEL/REC tracking (delivered/received empties)
 * - Bottle balance management (bottleBal in register)
 * - Cash collection entries (2800, 3000, 2400, 2890, 1960, etc.)
 * - Mixed customer types: Residential, Corporate, Commercial
 * - Multiple product rates (145-150 PKR per bottle)
 * 
 * Features:
 * - Route-based organization for rider efficiency
 * - Realistic delivery patterns (1-9 bottles per stop)
 * - Cash collection tracking (some paid, some pending)
 * - Bottle deposit float management
 * - Corporate accounts (offices, gyms, medical centers)
 * - Daily stops with historical data for KPI calculations
 */

// Extract real customer data from register pages
const DEMO_WATER_CUSTOMERS = [
  // ===== Page 1: Date 3/1/26 - DHA Phase 5 Routes =====
  // P1 Block - Premium residential
  { name: 'Villa 927', accountNo: 'P1-927', townCode: 'P1', houseNo: '927', route: 'DHA P1', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 2800, deliveryDays: 'Daily' },
  { name: 'Villa 988', accountNo: 'P1-988', townCode: 'P1', houseNo: '988', route: 'DHA P1', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 863', accountNo: 'P1-863', townCode: 'P1', houseNo: '863', route: 'DHA P1', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 794', accountNo: 'P1-794', townCode: 'P1', houseNo: '794', route: 'DHA P1', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  
  // P2 Block - Mixed residential and commercial
  { name: 'Office Complex P2', accountNo: 'P2-420', townCode: 'P2', houseNo: '?', route: 'DHA P2', type: 'Corporate', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 8, rate: 145, bottleBal: 8, lastCash: 3000, deliveryDays: 'Daily', phone: '+92 21 3567890' },
  { name: 'Villa 918', accountNo: 'P2-918', townCode: 'P2', houseNo: '918', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 204', accountNo: 'P2-204', townCode: 'P2', houseNo: '204', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 2, lastCash: 2400, deliveryDays: 'Daily' },
  { name: 'Villa 299', accountNo: 'P2-299', townCode: 'P2', houseNo: '299', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 381', accountNo: 'P2-381', townCode: 'P2', houseNo: '381', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 889', accountNo: 'P2-889', townCode: 'P2', houseNo: '889', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'New Acc 420', accountNo: 'P2-420N', townCode: 'P2', houseNo: '420', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 0, lastCash: 3000, deliveryDays: 'Daily' },
  { name: 'Villa 495', accountNo: 'P2-495', townCode: 'P2', houseNo: '495', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 848', accountNo: 'P2-848', townCode: 'P2', houseNo: '848', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 947', accountNo: 'P2-947', townCode: 'P2', houseNo: '947', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 943', accountNo: 'P2-943', townCode: 'P2', houseNo: '943', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 1960, deliveryDays: 'Daily' },
  { name: 'Villa 976', accountNo: 'P2-976', townCode: 'P2', houseNo: '976', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 1095', accountNo: 'P2-1095', townCode: 'P2', houseNo: '1095', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 1020', accountNo: 'P2-1020', townCode: 'P2', houseNo: '1020', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 767', accountNo: 'P2-767', townCode: 'P2', houseNo: '767', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 799', accountNo: 'P2-799', townCode: 'P2', houseNo: '799', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 2100, deliveryDays: 'Daily' },
  { name: 'Villa 808', accountNo: 'P2-808', townCode: 'P2', houseNo: '808', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 816', accountNo: 'P2-816', townCode: 'P2', houseNo: '816', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 2890, deliveryDays: 'Daily' },
  { name: 'Mr. Pink Note', accountNo: 'PINK-420', townCode: 'P2', houseNo: '?', route: 'DHA P2', type: 'Home & Flat', area: 'Defence Phase 5', postalCode: '75500', city: 'Karachi', dailyBottles: 0, rate: 150, bottleBal: 0, lastCash: 2890, deliveryDays: 'Custom', notes: 'MC Murda - Special customer (pink note in register)' },

  // ===== DHA Phase 2 Route =====
  { name: 'Ms. Ans', accountNo: 'P2-ANS', townCode: 'P.2', houseNo: '?', route: 'DHA Phase 2', type: 'Home & Flat', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 0, rate: 150, bottleBal: 0, lastCash: 0, deliveryDays: 'Custom' },
  { name: 'Villa 1098', accountNo: 'P2-1098', townCode: 'P.2', houseNo: '1098', route: 'DHA Phase 2', type: 'Home & Flat', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Villa 1607', accountNo: 'P2-1607', townCode: '10-B', houseNo: '1607', route: 'Gulshan 10-B', type: 'Home & Flat', area: 'Gulshan-e-Iqbal', postalCode: '75300', city: 'Karachi', dailyBottles: 0, rate: 150, bottleBal: 0, lastCash: 0, deliveryDays: 'Custom' },
  { name: 'Villa 851', accountNo: 'P2-851', townCode: 'P.2', houseNo: '851', route: 'DHA Phase 2', type: 'Home & Flat', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 0, rate: 150, bottleBal: 0, lastCash: 0, deliveryDays: 'Custom' },
  { name: 'Villa 871', accountNo: 'P2-871', townCode: 'P.2', houseNo: '871', route: 'DHA Phase 2', type: 'Home & Flat', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Plaza 262', accountNo: 'P2-262', townCode: 'P.2', houseNo: '262', route: 'DHA Phase 2', type: 'Commercial', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 140, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'House 206', accountNo: 'P2-206', townCode: 'P.2', houseNo: '206', route: 'DHA Phase 2', type: 'Home & Flat', area: 'Defence Phase 2', postalCode: '75500', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Shop 45', accountNo: '11B-45', townCode: '11-B', houseNo: '45', route: 'Clifton 11-B', type: 'Commercial', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 140, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Gym 99-96', accountNo: 'GYM-94', townCode: '11-B', houseNo: '99-96', route: 'Clifton 11-B', type: 'Corporate', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 140, bottleBal: 0, lastCash: 0, deliveryDays: 'Daily', phone: '+92 21 3578901' },

  // ===== Page 2: Date 1/3/26 - Clifton & Bahria Town Routes =====
  // Clifton 11-B Route
  { name: 'Gul 11-B', accountNo: '11B-001', townCode: '11-B', houseNo: '11-B', route: 'Clifton 11-B', type: 'Corporate', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 450, deliveryDays: 'Daily', phone: '+92 21 3456789' },
  { name: 'Casa Bella', accountNo: '11B-CASA', townCode: '11-B', houseNo: '?', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 450, deliveryDays: 'Daily' },
  { name: 'P3', accountNo: '11B-P3', townCode: '11-B', houseNo: 'P3', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 0, rate: 150, bottleBal: 0, lastCash: 0, deliveryDays: 'Custom' },
  { name: 'Essa A Flat', accountNo: 'ESA-089', townCode: '11-B', houseNo: 'Es.A', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Shop 90', accountNo: '11B-90', townCode: '11-B', houseNo: '90', route: 'Clifton 11-B', type: 'Commercial', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 4, rate: 140, bottleBal: 4, lastCash: 0, deliveryDays: 'Daily', phone: '+92 21 3567123' },
  { name: 'Block 79', accountNo: '11B-79', townCode: '11-B', houseNo: '79', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 99', accountNo: '11B-99', townCode: '11-B', houseNo: '99', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 117', accountNo: '11B-117', townCode: '11-B', houseNo: '117', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 490, deliveryDays: 'Daily' },
  { name: 'Block 119', accountNo: '11B-119', townCode: '11-B', houseNo: '119', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 96', accountNo: '11B-96', townCode: '11-B', houseNo: '96', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 96-C', accountNo: '11B-96C', townCode: '11-B', houseNo: '96-C', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 132', accountNo: '11B-132', townCode: '11-B', houseNo: '132', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 134', accountNo: '11B-134', townCode: '11-B', houseNo: '134', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 137', accountNo: '11B-137', townCode: '11-B', houseNo: '137', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 158-H', accountNo: '11B-158H', townCode: '11-B', houseNo: '158.H', route: 'Clifton 11-B', type: 'Home & Flat', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 150, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 648', accountNo: '11B-648', townCode: '11-B', houseNo: '648', route: 'Clifton 11-B', type: 'Commercial', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 2, rate: 140, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily' },

  // Bahria Town Routes (P.26, P.27, P.91)
  { name: 'Casa P26', accountNo: 'P26-CASA', townCode: 'P.26', houseNo: '?', route: 'Bahria P26', type: 'Home & Flat', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 8, rate: 150, bottleBal: 8, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 2483', accountNo: 'P27-2483', townCode: 'P.27', houseNo: '2483', route: 'Bahria P27', type: 'Home & Flat', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 9, rate: 150, bottleBal: 9, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 6141', accountNo: 'P27-6141', townCode: 'P.27', houseNo: '6141', route: 'Bahria P27', type: 'Home & Flat', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 3, rate: 150, bottleBal: 3, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Block 23', accountNo: 'P91-23', townCode: 'P.91', houseNo: '23', route: 'Bahria P91', type: 'Corporate', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 9, rate: 145, bottleBal: 9, lastCash: 800, deliveryDays: 'Daily', phone: '+92 21 3678012' },
  { name: 'Block 41', accountNo: 'P91-41', townCode: 'P.91', houseNo: '41', route: 'Bahria P91', type: 'Home & Flat', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 1, rate: 150, bottleBal: 1, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Paragon 283', accountNo: 'P91-283', townCode: 'P.91', houseNo: '283', route: 'Bahria Paragon', type: 'Home & Flat', area: 'Bahria Town', postalCode: '75340', city: 'Karachi', dailyBottles: 4, rate: 150, bottleBal: 4, lastCash: 0, deliveryDays: 'Daily' },
  { name: 'Bilquish 901', accountNo: 'TH-501', townCode: '11-B', houseNo: 'TH', route: 'Clifton 11-B', type: 'Corporate', area: 'Clifton', postalCode: '75600', city: 'Karachi', dailyBottles: 4, rate: 140, bottleBal: 4, lastCash: 600, deliveryDays: 'Daily', phone: '+92 21 3589234' },
  { name: 'Milk Shop Bilquish', accountNo: 'MILK-2088', townCode: '10-B', houseNo: 'MilkShop', route: 'Gulshan 10-B', type: 'Commercial', area: 'Gulshan-e-Iqbal', postalCode: '75300', city: 'Karachi', dailyBottles: 2, rate: 140, bottleBal: 2, lastCash: 0, deliveryDays: 'Daily', phone: '+92 21 3590345' },
  { name: 'Cloud Med Center', accountNo: 'PMED-1687', townCode: '10-B', houseNo: 'Med.18', route: 'Gulshan Med', type: 'Commercial', area: 'Gulshan-e-Iqbal', postalCode: '75300', city: 'Karachi', dailyBottles: 4, rate: 140, bottleBal: 4, lastCash: 380, deliveryDays: 'Daily', phone: '+92 21 3601456' },
  { name: 'Al-Baseer Medical', accountNo: 'MEDI-2023', townCode: '10-B', houseNo: 'Medi.18', route: 'Gulshan Med', type: 'Commercial', area: 'Gulshan-e-Iqbal', postalCode: '75300', city: 'Karachi', dailyBottles: 6, rate: 140, bottleBal: 6, lastCash: 900, deliveryDays: 'Daily', phone: '+92 21 3612567' },

  // ===== Page 3: Date 1/3/26 - Financial Summary Day =====
  // Summary from register shows:
  // Route Income: 116980 PKR
  // Exp: 14190 PKR 
  // Route Balance: 102790 PKR (this is daily profit)
  // Income breakdown details (6 major expense categories):
  // - Hi-End: Machine 10200
  // - Machine: Online Machine 23100
  // - Hussain Gardavala: 98100
  // - Muzzit: 3hp ~ 9990 Swear (fuel?)
  // - Sheikbur: Muttne ~ 2690 (misc)
  // - Others: Printing Bills 2440, Biscuity Exp 440, Total Exp: 14190
  
  // Additional commercial accounts from other pages
  { name: 'Hi-End Machine Corp', accountNo: 'CORP-101', townCode: 'COM', houseNo: 'Ind', route: 'Corporate Accounts', type: 'Corporate', area: 'Industrial Area', postalCode: '75950', city: 'Karachi', dailyBottles: 0, rate: 145, bottleBal: 0, lastCash: 10200, deliveryDays: 'Weekly', phone: '+92 21 3623678', notes: 'Large dispenser fleet - weekly billing' },
  { name: 'Online Machine Services', accountNo: 'CORP-102', townCode: 'COM', houseNo: 'Off', route: 'Corporate Accounts', type: 'Corporate', area: 'Saddar', postalCode: '74200', city: 'Karachi', dailyBottles: 0, rate: 145, bottleBal: 0, lastCash: 23100, deliveryDays: 'Monthly', phone: '+92 21 3634789', notes: 'Monthly corporate contract' },
];

// Realistic expense categories from actual register page 3
const DEMO_EXPENSES = [
  { date: '2026-01-03', category: 'plant_equipment', amount: 10200, notes: 'Hi-End Machine maintenance' },
  { date: '2026-01-03', category: 'plant_equipment', amount: 23100, notes: 'Online Machine servicing' },
  { date: '2026-01-03', category: 'supplier_water', amount: 98100, notes: 'Hussain Gardavala - bulk water purchase' },
  { date: '2026-01-03', category: 'vehicle_fuel', amount: 9990, notes: 'Muzzit - 3hp fuel & transport' },
  { date: '2026-01-03', category: 'office_supplies', amount: 2690, notes: 'Sheikbur - miscellaneous supplies' },
  { date: '2026-01-03', category: 'printing', amount: 2440, notes: 'Printing Bills - thermal paper' },
  { date: '2026-01-03', category: 'office_supplies', amount: 440, notes: 'Biscuity - office snacks' },
];

async function main() {
  const pool = createPool();
  const client = await pool.connect();
  
  try {
    console.log('🔍 Fetching demo-water business...');
    const bRes = await client.query('SELECT id, settings, category FROM businesses WHERE domain = $1', ['demo-water']);
    if (bRes.rows.length === 0) {
      console.log('❌ demo-water business not found.');
      console.log('Run: bun run scripts/data-lab/seed-master-demo.mjs --only demo-water');
      process.exit(1);
    }
    const businessId = bRes.rows[0].id;
    const category = bRes.rows[0].category;
    const settings = bRes.rows[0].settings || {};
    
    console.log(`✓ Found business: ${businessId} (${category})`);
    
    // Fetch products
    console.log('🔍 Fetching water products...');
    const pRes = await client.query(
      'SELECT id, name, price, unit, category FROM products WHERE business_id = $1 AND is_deleted = false ORDER BY name',
      [businessId]
    );
    const products = pRes.rows;
    
    // Identify product types
    const refill19L = products.find(p => /19\s*L|gallon|jar|refill/i.test(p.name));
    const bottle5L = products.find(p => /5\s*L/i.test(p.name));
    const case1_5L = products.find(p => /1\.5\s*L|1500\s*ml/i.test(p.name));
    const emptyDeposit = products.find(p => /deposit|empty|security/i.test(p.name));
    const dispenser = products.find(p => /dispenser|stand|cooler/i.test(p.name));
    
    if (!refill19L) {
      console.log('⚠️  WARNING: 19L refill product not found. Creating...');
    }
    
    console.log(`✓ Found ${products.length} products`);
    console.log(`  Primary: ${refill19L?.name || 'N/A'}`);
    console.log(`  Secondary: ${bottle5L?.name || 'N/A'}, ${case1_5L?.name || 'N/A'}`);
    
    // Clean existing demo data (handle foreign key constraints)
    console.log('\n🧹 Cleaning existing demo data...');
    await client.query('BEGIN');
    try {
      // Delete in correct order respecting foreign keys
      await client.query('DELETE FROM water_delivery_lines WHERE business_id = $1', [businessId]);
      await client.query('DELETE FROM water_delivery_stops WHERE business_id = $1', [businessId]);
      
      // Delete invoices that reference customers (to avoid FK constraint violations)
      await client.query('DELETE FROM invoice_payments WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = $1)', [businessId]);
      await client.query('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = $1)', [businessId]);
      await client.query('DELETE FROM invoices WHERE business_id = $1', [businessId]);
      
      // Now safe to delete customers
      await client.query('DELETE FROM customers WHERE business_id = $1', [businessId]);
      
      await client.query('COMMIT');
      console.log('✓ Cleaned existing data (delivery stops, invoices, customers)');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
    
    // Seed customers
    console.log(`\n👥 Seeding ${DEMO_WATER_CUSTOMERS.length} realistic customers...`);
    const customerIds = [];
    let cusCreated = 0;
    
    for (const cust of DEMO_WATER_CUSTOMERS) {
      const domainData = {
        customertype: cust.type,
        accountno: cust.accountNo,
        towncode: cust.townCode,
        city: cust.city,
        deliveryarea: cust.area,
        postalcode: cust.postalCode,
        houseno: cust.houseNo,
        deliveryroute: cust.route,
        deliverydays: cust.deliveryDays,
        dailybottles: cust.dailyBottles,
        productrate: cust.rate,
        bottlebalance: cust.bottleBal,
        deliveryactive: cust.deliveryDays === 'Daily' || cust.dailyBottles > 0,
        preferredpayment: cust.type === 'Corporate' ? 'Monthly Credit' : 'Weekly Credit',
        lastcashcollected: cust.lastCash || 0,
      };
      
      const insRes = await client.query(
        `INSERT INTO customers (business_id, name, phone, address, city, domain_data, notes, created_at, updated_at, is_active, is_deleted) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true, false) RETURNING id`,
        [
          businessId,
          cust.name,
          cust.phone || null,
          `${cust.houseNo && cust.houseNo !== '?' ? cust.houseNo + ', ' : ''}${cust.area}`,
          cust.city,
          JSON.stringify(domainData),
          cust.notes || null,
        ]
      );
      customerIds.push({ id: insRes.rows[0].id, ...cust });
      cusCreated++;
    }
    
    console.log(`✓ Created ${cusCreated} customers`);
    console.log(`  Routes: DHA P1/P2, Clifton 11-B, Bahria P26/P27/P91, Gulshan 10-B`);
    console.log(`  Types: ${customerIds.filter(c => c.type === 'Corporate').length} Corporate, ${customerIds.filter(c => c.type === 'Commercial').length} Commercial, ${customerIds.filter(c => c.type === 'Home & Flat').length} Residential`);
    
    // Seed today's deliveries
    console.log('\n🚚 Seeding today route deliveries...');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    let stopsCreated = 0;
    let linesCreated = 0;
    let cashCollected = 0;
    
    for (const cust of customerIds.filter(c => c.deliveryDays === 'Daily' && c.dailyBottles > 0)) {
      // Create stop
      const cash = cust.lastCash || 0;
      cashCollected += cash;
      
      const stopRes = await client.query(
        `INSERT INTO water_delivery_stops 
        (business_id, delivery_date, customer_id, house_no_snapshot, customer_name_snapshot, route_label, 
         account_no_snapshot, town_code_snapshot, cash_collected, status, "created_at", "updated_at", is_deleted)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), false)
        RETURNING id`,
        [
          businessId,
          today,
          cust.id,
          cust.houseNo,
          cust.name,
          cust.route,
          cust.accountNo,
          cust.townCode,
          cash,
          'confirmed'
        ]
      );
      
      const stopId = stopRes.rows[0].id;
      stopsCreated++;
      
      // Create delivery line for 19L
      if (refill19L) {
        await client.query(
          `INSERT INTO water_delivery_lines 
          (business_id, stop_id, product_id, product_name_snapshot, unit_snapshot, quantity, received_quantity, unit_price_snapshot, "created_at", "updated_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            businessId,
            stopId,
            refill19L.id,
            refill19L.name,
            refill19L.unit || 'bottle',
            cust.dailyBottles,
            cust.dailyBottles, // DEL = REC in refill model
            cust.rate
          ]
        );
        linesCreated++;
      }
    }
    
    console.log(`✓ Created ${stopsCreated} stops with ${linesCreated} delivery lines`);
    console.log(`  Cash collected today: PKR ${cashCollected.toLocaleString()}`);
    
    // Seed historical data (last 10 days for realistic KPIs)
    console.log('\n📊 Seeding historical deliveries (last 10 days)...');
    let historicalStops = 0;
    let historicalLines = 0;
    
    for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - dayOffset);
      
      // Only daily customers
      const dailyCustomers = customerIds.filter(c => c.deliveryDays === 'Daily' && c.dailyBottles > 0);
      
      // Randomly skip some customers on some days (realistic pattern)
      const activeToday = dailyCustomers.filter(() => Math.random() > 0.15); // 85% delivery rate
      
      for (const cust of activeToday) {
        const stopRes = await client.query(
          `INSERT INTO water_delivery_stops 
          (business_id, delivery_date, customer_id, house_no_snapshot, customer_name_snapshot, route_label, 
           account_no_snapshot, town_code_snapshot, cash_collected, status, "created_at", "updated_at", is_deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), false)
          RETURNING id`,
          [
            businessId,
            pastDate,
            cust.id,
            cust.houseNo,
            cust.name,
            cust.route,
            cust.accountNo,
            cust.townCode,
            dayOffset <= 3 ? Math.floor(Math.random() * cust.dailyBottles * cust.rate) : 0, // Recent cash collection
            'confirmed'
          ]
        );
        
        if (refill19L) {
          await client.query(
            `INSERT INTO water_delivery_lines 
            (business_id, stop_id, product_id, product_name_snapshot, unit_snapshot, quantity, received_quantity, unit_price_snapshot, "created_at", "updated_at")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [
              businessId,
              stopRes.rows[0].id,
              refill19L.id,
              refill19L.name,
              refill19L.unit || 'bottle',
              cust.dailyBottles,
              cust.dailyBottles,
              cust.rate
            ]
          );
          historicalLines++;
        }
        historicalStops++;
      }
    }
    
    console.log(`✓ Created ${historicalStops} historical stops with ${historicalLines} lines`);
    
    // Update business settings with water hisab configuration
    if (refill19L) {
      const updatedSettings = {
        ...settings,
        waterHisab: {
          ...((settings.waterHisab && typeof settings.waterHisab === 'object') ? settings.waterHisab : {}),
          productIds: [refill19L.id, bottle5L?.id, case1_5L?.id, emptyDeposit?.id, dispenser?.id].filter(Boolean),
          defaultProductId: refill19L.id,
        },
        storefront: {
          ...((settings.storefront && typeof settings.storefront === 'object') ? settings.storefront : {}),
          waterDelivery: {
            hisabProductIds: [refill19L.id, bottle5L?.id, case1_5L?.id].filter(Boolean),
          },
        },
      };
      
      await client.query(
        'UPDATE businesses SET settings = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedSettings), businessId]
      );
      
      console.log('✓ Updated business settings with water hisab configuration');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESSFULLY SEEDED REALISTIC WATER DELIVERY DEMO');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`  Customers:          ${customerIds.length}`);
    console.log(`  Today's stops:      ${stopsCreated}`);
    console.log(`  Historical stops:   ${historicalStops} (10 days)`);
    console.log(`  Total lines:        ${linesCreated + historicalLines}`);
    console.log(`  Cash today:         PKR ${cashCollected.toLocaleString()}`);
    console.log('');
    console.log('🗺️  ROUTES:');
    console.log('  • DHA Phase 5 (P1, P2) - Premium residential');
    console.log('  • DHA Phase 2 - Mixed residential');
    console.log('  • Clifton 11-B - Commercial + residential');
    console.log('  • Bahria Town (P26, P27, P91) - Gated community');
    console.log('  • Gulshan 10-B Medical - Commercial clusters');
    console.log('  • Corporate Accounts - Large contracts');
    console.log('');
    console.log('💡 TEST FEATURES:');
    console.log('  📊 Route Hisab: /business/water-delivery → Route Hisab tab');
    console.log('  💰 Generate weekly/monthly bills with real customer data');
    console.log('  🚚 Daily DEL/REC tracking with bottle balance');
    console.log('  📈 Dashboard KPIs with 10-day historical data');
    console.log('  🧾 58mm thermal bills (EN/Urdu)');
    console.log('  📱 WhatsApp reminders with bill details');
    console.log('');
    console.log('💵 REALISTIC FINANCIALS (from actual register):');
    console.log(`  Daily Route Income: ~PKR 116,980`);
    console.log(`  Daily Expenses:     ~PKR 14,190`);
    console.log(`  Daily Net Profit:   ~PKR 102,790`);
    console.log('');
    
  } catch (err) {
    console.error('❌ Error seeding water delivery demo:', err);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
