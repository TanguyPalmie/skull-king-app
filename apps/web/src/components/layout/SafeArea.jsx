import React from 'react';
import Box from '@mui/material/Box';

export default function SafeArea({ children, sx, ...props }) {
  return (
    <Box
      sx={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
