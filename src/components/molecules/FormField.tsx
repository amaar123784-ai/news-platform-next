/**
 * FormField Component
 * 
 * Label + Input combination with proper accessibility relationships.
 * 
 * @see components.forms in design-system.json
 * 
 * @example
 * <FormField
 *   label="البريد الإلكتروني"
 *   type="email"
 *   placeholder="أدخل بريدك الإلكتروني"
 *   icon="ri-mail-line"
 *   required
 * />
 */

import React from 'react';
import { Input, type InputProps } from '@/components/atoms';

export interface FormFieldProps extends InputProps {
    /** Field label */
    label: string;
    /** Whether field is required */
    required?: boolean;
    /** Help text shown below input */
    helpText?: string;
    /** Render as textarea */
    multiline?: boolean;
    /** Rows for textarea */
    rows?: number;
}

// Classes from design-system.json components.forms.label
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
const baseInputClass = 'w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-colors';

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required = false,
    helpText,
    id,
    multiline = false,
    rows = 4,
    ...inputProps
}) => {
    const generatedId = React.useId();
    const fieldId = id || `field-${generatedId}`;

    return (
        <div>
            <label htmlFor={fieldId} className={labelClass}>
                {label}
                {required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
            </label>
            {multiline ? (
                <textarea
                    id={fieldId}
                    {...inputProps as any}
                    rows={rows}
                    className={`${baseInputClass} p-3 ${inputProps.className || ''}`}
                />
            ) : (
                <Input
                    id={fieldId}
                    aria-required={required}
                    {...inputProps}
                />
            )}
            {helpText && !inputProps.hasError && (
                <p className="mt-1 text-xs text-gray-500">{helpText}</p>
            )}
        </div>
    );
};

export default FormField;
