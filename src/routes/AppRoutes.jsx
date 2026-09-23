import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import {
  DashboardView,
  WalletsView,
  TransactionsView,
  BudgetsView,
  AnalyticsView,
  GoalsView,
  DebtsView,
  SecurityView,
  LoginView,
  RegisterView,
  NotFoundView,
} from '../views';

export default function AppRoutes({ isAuthenticated = true, onUnlock }) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginView onUnlock={onUnlock} />} />
      <Route path="/register" element={<RegisterView />} />

      {/* Protected Routes inside App */}
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DashboardView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallets"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <WalletsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <TransactionsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <BudgetsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AnalyticsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <GoalsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DebtsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/security"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SecurityView />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}
