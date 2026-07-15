import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {/* Chrome's mobile "tap highlight" paints a translucent blue flash over
            any tapped element by default (web builds only — native has no such
            artifact). Kill it globally so buttons don't flash blue on tap. */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `* { -webkit-tap-highlight-color: transparent; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
