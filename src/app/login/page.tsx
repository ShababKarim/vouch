'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { Phone, ArrowRight, ChevronDown } from 'lucide-react';
import { countries, formatPhoneNumberForE164, getUserCountry, type Country } from '@/lib/countries';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country>(getUserCountry());
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone.trim()) {
            setError('Please enter your phone number');
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
            await login(formattedPhone);
            router.push(`/verify?phone=${encodeURIComponent(formattedPhone)}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send code');
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');

        // Format based on selected country
        if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
            if (cleaned.length <= 3) return cleaned;
            if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }

        // Default formatting for other countries
        return cleaned;
    };

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsCountryDropdownOpen(false);
        setPhone(''); // Clear phone number when country changes
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Vouch</h1>
                    <p className="mt-2 text-sm text-gray-600">Event invitations with a twist</p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
                    <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone number
                            </label>
                            <div className="relative mt-1 flex rounded-md shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                    className="relative inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset"
                                >
                                    <span className="mr-2 text-lg">{selectedCountry.flag}</span>
                                    <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                </button>

                                <div className="relative flex-1 rounded-r-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                        className="block w-full border-none pt-2.5 pr-3 pl-10 placeholder-gray-400 focus:outline-none sm:text-sm"
                                        placeholder={
                                            selectedCountry.code === 'US' || selectedCountry.code === 'CA'
                                                ? '(555) 123-4567'
                                                : 'Phone number'
                                        }
                                    />
                                </div>
                            </div>

                            {isCountryDropdownOpen && (
                                <div className="ring-opacity-5 absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm">
                                    {countries.map((country) => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => handleCountrySelect(country)}
                                            className="flex w-full items-center px-3 py-2 text-left whitespace-nowrap text-gray-900 hover:bg-gray-100"
                                        >
                                            <span className="mr-3 flex-shrink-0 text-lg">{country.flag}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium">{country.name}</div>
                                                <div className="text-xs text-gray-500">{country.dialCode}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-800">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                Send verification code
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">New to Vouch?</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link href="/invite" className="font-medium text-blue-600 hover:text-blue-500">
                                Join an event with an invite code
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
