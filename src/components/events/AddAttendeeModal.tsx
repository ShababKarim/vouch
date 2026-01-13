'use client';

import { useState } from 'react';
import { X, Phone, UserPlus, ChevronDown } from 'lucide-react';
import { countries, formatPhoneNumberForE164, getUserCountry, type Country } from '@/lib/countries';

interface AddAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAttendee: (phone: string) => Promise<void>;
}

export default function AddAttendeeModal({ isOpen, onClose, onAddAttendee }: AddAttendeeModalProps) {
  console.log('AddAttendeeModal render - isOpen:', isOpen);

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(getUserCountry());
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumberForE164(phone, selectedCountry.dialCode);
      await onAddAttendee(formattedPhone);
      setPhone('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attendee');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (selectedCountry.code === 'US') {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="bg-opacity-75 fixed inset-0 bg-gray-900 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Add Attendee</h3>
              <button onClick={onClose} className="rounded-md text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="flex items-center pr-2 pl-3 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <span className="mr-1">{selectedCountry.flag}</span>
                      <span className="mr-1">{selectedCountry.dialCode}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 z-10 mt-1 max-h-60 w-48 overflow-auto rounded-md bg-white shadow-lg">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsCountryDropdownOpen(false);
                            setPhone('');
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-2">{country.flag}</span>
                          <span className="mr-2">{country.dialCode}</span>
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    className="block w-full rounded-md border-gray-300 pr-10 pl-24 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter the phone number of the person you want to invite</p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Attendee
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
