import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';

export default function RatingDialog({ open, onClose, onSubmit, playerName }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit({ rating, comment: comment.trim() || undefined });
      setRating(0);
      setComment('');
      onClose();
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        {t('rating.title')}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 2 }}
        >
          {t('rating.description', { name: playerName })}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            emptyIcon={<StarIcon sx={{ opacity: 0.3, fontSize: 40 }} />}
            icon={<StarIcon sx={{ fontSize: 40 }} />}
            sx={{
              '& .MuiRating-icon': {
                mx: 0.5,
              },
            }}
          />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={3}
          label={t('rating.comment')}
          placeholder={t('rating.commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ minHeight: 48, flex: 1 }}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={rating === 0}
          sx={{ minHeight: 48, flex: 1 }}
        >
          {t('rating.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
