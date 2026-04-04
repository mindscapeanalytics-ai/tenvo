# SyncIndicator Component - Usage Guide

## Overview

The `SyncIndicator` component displays real-time sync status for multi-location inventory management. It shows the last synced timestamp, connection status, and sync latency warnings.

**Task:** 8.5 - Implement real-time sync with Supabase Realtime  
**Requirements:** 4.1 - Multi-Location Real-Time Sync

## Features

- ✅ Real-time sync status display
- ✅ Last synced timestamp with auto-updating time ago
- ✅ Online/offline detection
- ✅ Sync latency warnings (<2 seconds requirement)
- ✅ Compact mode for space-constrained layouts
- ✅ Color-coded status indicators

## Installation

The component is already created at `components/inventory/SyncIndicator.jsx`.

## Basic Usage

### With useMultiLocationSync Hook

```jsx
import { useMultiLocationSync 