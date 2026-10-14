import React from 'react';
import { AuthUser } from '../types';
import { AuthModal } from './AuthModal';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = (props) => {
  return <AuthModal {...props} initialMode="signin" />;
};
