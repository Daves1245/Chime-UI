import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <UserProvider>{children}</UserProvider>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
