import { useMutation, useQueryClient } from '@tanstack/react-query';
import { friendKeys } from './friends.constants';

/**
 * One press of a button on a row: while it runs, whether it failed, and every list asked
 * again once it has worked, a friend's wardrobe included, since a relation that ends
 * changes what that answers.
 */
export function useFriendAction() {
  const queryClient = useQueryClient();
  const action = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });

  return {
    act: (run: () => Promise<unknown>) => action.mutate(run),
    busy: action.isPending,
    failed: action.isError,
    dismiss: () => action.reset(),
  };
}
