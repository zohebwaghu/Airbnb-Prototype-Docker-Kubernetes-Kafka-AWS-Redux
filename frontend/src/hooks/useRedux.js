// Custom hooks for Redux
import { useSelector, useDispatch } from 'react-redux';

// Auth hooks
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  
  return {
    ...auth,
    dispatch
  };
};

// Property hooks
export const useProperties = () => {
  const dispatch = useDispatch();
  const properties = useSelector((state) => state.properties);
  
  return {
    ...properties,
    dispatch
  };
};

// Booking hooks
export const useBookings = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.bookings);
  
  return {
    ...bookings,
    dispatch
  };
};

