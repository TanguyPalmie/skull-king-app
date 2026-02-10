import React from 'react';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

export default function LanguageChip({ langCode, selected, onClick, onDelete, sx, ...props }) {
  const { t } = useTranslation();

  const label = t(`languages.${langCode}`, langCode);

  return (
    <Chip
      label={label}
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
      onDelete={onDelete}
      sx={{
        minHeight: 40,
        fontSize: '0.875rem',
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
      {...props}
    />
  );
}
