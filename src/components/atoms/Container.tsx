/**
 * Container Component
 * 
 * Layout wrapper that enforces max-width and centering from design system.
 * 
 * @see layout.container in design-system.json
 * 
 * @example
 * <Container>Content here</Container>
 * <Container maxWidth="full">Full width content</Container>
 */

import React from 'react';

export interface ContainerProps {
    /** Children elements */
    children: React.ReactNode;
    /** Max width variant */
    maxWidth?: '7xl' | 'full';
    /** Whether to add horizontal padding */
    padded?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** HTML element to render as */
    as?: 'div' | 'section' | 'main' | 'article' | 'aside';
}

// Classes from design-system.json layout.container
const maxWidthClasses = {
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
    children,
    maxWidth = '7xl',
    padded = true,
    className = '',
    as: Component = 'div',
}) => {
    return (
        <Component
            className={`
        ${maxWidthClasses[maxWidth]} 
        mx-auto 
        ${padded ? 'px-4' : ''} 
        ${className}
      `}
        >
            {children}
        </Component>
    );
};

export default Container;
