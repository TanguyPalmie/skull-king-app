import React from 'react';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import { useTranslation } from 'react-i18next';

export default function SportChip({ sportKey, level, selected, onClick, onDelete, sx, ...props }) {
  const { t } = useTranslation();

  const label = t(`sports.${sportKey}`, sportKey);
  const levelLabel = level ? t(`onboarding.level${level}`) : null;

  const chip = (
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

  if (level) {
    return (
      <Badge
        badgeContent={levelLabel}
        color="secondary"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.65rem',
            height: 18,
            minWidth: 18,
            px: 0.5,
          },
        }}
      >
        {chip}
      </Badge>
    );
  }

  return chip;
}
