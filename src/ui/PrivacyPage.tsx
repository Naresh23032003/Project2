export function PrivacyPage() {
  return (
    <main className="page prose" id="main">
      <h1>How we know nothing leaves your device</h1>
      <p>
        Dripcheck reads your statement inside this browser tab. It has no server that could receive it, and the page is built so that a
        mistake could not send it anywhere either. Here is how to check that for yourself.
      </p>

      <h2>What happens to your file</h2>
      <p>
        When you drop a file, your browser hands it to a background worker in this same tab. The worker reads it, finds the recurring
        charges and gives the result back to the page. The file is never uploaded, and the worker has no way to make a network call to
        anywhere but this site.
      </p>

      <h2>Check it in a minute</h2>
      <ol>
        <li>Open your browser's developer tools. Press F12, or Cmd+Option+I on a Mac.</li>
        <li>Open the Network tab.</li>
        <li>Clear the list, then drop in a statement or press "Try with sample data".</li>
        <li>Watch the list. Nothing new appears. The only requests are the ones that loaded this page.</li>
        <li>Now turn off your Wi-Fi and try again. It still works, because everything it needs is already on your device.</li>
      </ol>

      <h2>It's locked down, not just promised</h2>
      <p>
        This site tells your browser to refuse any connection to other sites. The rule is called a Content Security Policy, and the
        part that matters is <code>connect-src 'self'</code>. Even if there were a bug in the code, the browser would block it from
        sending your data to someone else. You can see the policy in the Network tab by clicking the first request and reading its
        response headers.
      </p>

      <h2>What is saved</h2>
      <ul>
        <li>Your statement: never saved anywhere. Close the tab and it's gone.</li>
        <li>PDF passwords: kept in memory only, and dropped when you close the tab.</li>
        <li>Your Keep and Cancel choices: saved only if you tick "Remember my choices". They are stored in this browser, nothing else. "Forget everything" deletes them.</li>
        <li>Light or dark theme: remembered in this browser so it doesn't flip each visit.</li>
      </ul>

      <h2>No analytics, no cookies</h2>
      <p>This version has none. Nothing is counted, and nothing about your statement could be, because nothing is sent.</p>

      <h2>Links you choose to click</h2>
      <p>
        The cancel guides link to company help pages. Those links open other sites, and only when you click them. We don't add anything
        from your statement to those links.
      </p>

      <h2>Read the code</h2>
      <p>
        The source is public on <a href="https://github.com/Naresh23032003/Project2">GitHub</a>. The detection is plain code you can read,
        not a model. Every result shows the reason it was flagged.
      </p>

      <h2>What we can't promise</h2>
      <p>
        Detection is a careful guess from dates and amounts. It can miss things and it can flag something that isn't a subscription.
        That is why each result carries a label (Sure, Likely or Maybe) and why you make the final call. Check before you cancel anything.
      </p>
    </main>
  );
}
