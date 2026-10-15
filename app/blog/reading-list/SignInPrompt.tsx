'use client';
import { useBlog } from '../_components/ReaderProvider';

export function SignInPrompt() {
  const { t, openSignIn } = useBlog();
  return (
    <div className="py-16 text-center">
      <p className="text-[16px] text-[#6b6b6b]">{t('readingListSignIn')}</p>
      <button type="button" onClick={() => openSignIn()} className="mt-6 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] text-white hover:bg-black">
        {t('signIn')}
      </button>
    </div>
  );
}
