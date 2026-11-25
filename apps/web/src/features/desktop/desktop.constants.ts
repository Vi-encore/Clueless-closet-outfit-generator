import calendar from 'pixelarticons/svg/calendar.svg';
import chart from 'pixelarticons/svg/chart.svg';
import human from 'pixelarticons/svg/human.svg';
import message from 'pixelarticons/svg/message.svg';
import shirt from 'pixelarticons/svg/shirt.svg';
import users from 'pixelarticons/svg/users.svg';
import { uk } from '../../shared/i18n/uk';

export const SHORTCUTS = [
  { to: '/wardrobe', icon: shirt, label: uk.wardrobe.title },
  { to: '/outfits', icon: human, label: uk.outfits.title },
  { to: '/diary', icon: calendar, label: uk.diary.title },
  { to: '/stats', icon: chart, label: uk.stats.title },
  { to: '/friends', icon: users, label: uk.friends.title },
  { to: '/chat', icon: message, label: uk.chat.title },
];
