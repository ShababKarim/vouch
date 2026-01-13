export interface User {
  id: string;
  phone: string;
  displayName: string;
  photoUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  datetime: string;
  location: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  status: string;
  inviteCode: string;
  memberships: Array<{
    id: string;
    role: string;
    rsvpStatus: string;
    user: {
      id: string;
      displayName: string;
      photoUrl?: string;
    };
  }>;
  _count: {
    memberships: number;
    outcomes: number;
  };
}

export interface Settlement {
  id: string;
  amount: number;
  isSettled: boolean;
  debtor: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
  creditor: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
  event: {
    id: string;
    title: string;
  };
}

export interface Option {
  id: string;
  label: string;
  createdAt: string;
  totalAmount: number;
  userBet: {
    id: string;
    amount: number;
    createdAt: string;
  } | null;
  betCount: number;
}

export interface Outcome {
  id: string;
  question: string;
  status: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'REFUNDED';
  winningOptionId?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
  options: Option[];
}

export interface Bet {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
  option: {
    id: string;
    label: string;
  };
}

export type TabType = 'details' | 'attendees' | 'bets' | 'settlements';
