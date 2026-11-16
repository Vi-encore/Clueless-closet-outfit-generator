import { uk } from '../../shared/i18n/uk';
import { useInstallOffer } from './use-install-offer';

/** On the desktop: a button where the browser can install, a hint where only a person can. */
export function InstallOffer() {
  const offer = useInstallOffer();

  if (offer.kind === 'prompt') {
    return (
      <button type="button" className="action mt-4 self-start" onClick={offer.install}>
        {uk.install.offer}
      </button>
    );
  }

  if (offer.kind === 'ios-hint') {
    return (
      <div className="sheet mt-4 flex flex-col gap-2">
        <p>{uk.install.iosHint}</p>
        <button type="button" className="self-start" onClick={offer.dismiss}>
          {uk.install.dismiss}
        </button>
      </div>
    );
  }

  return null;
}
