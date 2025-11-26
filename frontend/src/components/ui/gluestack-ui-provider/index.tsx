import React from 'react';
import { createConfig } from '@gluestack-ui/nativewind-utils/config';

const config = createConfig({
  aliases: {
    'className': 'className',
    'class': 'className',
  },
});

type GluestackUIProviderProps = {
  children: React.ReactNode;
};

export const GluestackUIProvider: React.FC<GluestackUIProviderProps> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};

export default GluestackUIProvider;