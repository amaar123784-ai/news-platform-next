"use client";

import { useEffect, useRef } from 'react';
import { UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';

/**
 * useFormPersist Hook
 * 
 * Automatically persists react-hook-form state to localStorage.
 * Prevents data loss during power cuts or accidental refreshes.
 * 
 * @param form - The react-hook-form instance
 * @param storageKey - Unique key for storage
 * @param enabled - Whether persistence is enabled
 */
export function useFormPersist<TFieldValues extends FieldValues>(
    form: UseFormReturn<TFieldValues>,
    storageKey: string,
    enabled: boolean = true
) {
    const { watch, setValue } = form;
    const isRestoring = useRef(false);

    // 1. Restore from storage on mount
    useEffect(() => {
        if (!enabled) return;

        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                isRestoring.current = true;
                const parsed = JSON.parse(savedData);
                
                // Set values individually to ensure validation/state sync
                Object.keys(parsed).forEach((key) => {
                    setValue(key as Path<TFieldValues>, parsed[key] as PathValue<TFieldValues, Path<TFieldValues>>, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                });
            } catch (error) {
                console.error('Failed to restore form state:', error);
            } finally {
                isRestoring.current = false;
            }
        }
    }, [storageKey, enabled, setValue]);

    // 2. Watch and persist changes
    useEffect(() => {
        if (!enabled) return;

        const subscription = watch((value: any) => {
            if (isRestoring.current) return;
            localStorage.setItem(storageKey, JSON.stringify(value));
        });

        return () => subscription.unsubscribe();
    }, [watch, storageKey, enabled]);

    // 3. Clear storage helper
    const clearStorage = () => {
        localStorage.removeItem(storageKey);
    };

    return { clearStorage };
}
