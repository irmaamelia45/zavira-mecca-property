import React from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getPasswordChecklist } from '../../lib/password';
import { cn } from '../../lib/utils';

export default function PasswordChecklist({ password = '', className = '' }) {
    const value = String(password || '');
    const checklist = getPasswordChecklist(value);
    const hasStartedTyping = value.length > 0;

    return (
        <ul className={cn('space-y-1', className)} aria-live="polite" aria-label="Checklist validasi password">
            {checklist.map((item) => {
                const isValid = item.isMet;
                const Icon = isValid ? FiCheckCircle : FiXCircle;

                return (
                    <li
                        key={item.key}
                        className={cn(
                            'flex items-center gap-2 text-xs font-medium',
                            isValid
                                ? 'text-green-700'
                                : hasStartedTyping
                                    ? 'text-red-600'
                                    : 'text-slate-500'
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
