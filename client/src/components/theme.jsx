import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { inputsCustomizations } from '../components/themeCustomization/inputs';
import { dataDisplayCustomizations } from '../components/themeCustomization/dataDisplay';
import { navigationCustomizations } from '../components/themeCustomization/navigation';
import { surfacesCustomizations } from '../components/themeCustomization/surface';
import { colorSchemes, typography, shadows, shape } from '../components/themeCustomization/themePrimitive';

export default function AppTheme(props) {
  const { children, disableCustomTheme, themeComponents } = props;

  // Debugging
  console.log('Customizations:', {
    inputsCustomizations,
    dataDisplayCustomizations,
    navigationCustomizations,
    surfacesCustomizations,
    themeComponents,
  });

  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? createTheme() // Use Material-UI default theme
      : createTheme({
          cssVariables: {
            colorSchemeSelector: 'data-mui-color-scheme',
            cssVarPrefix: 'template',
          },
          colorSchemes,
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations || {}, // Fallback to empty object
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents || {},
          },
        });
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
