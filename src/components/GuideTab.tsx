export function GuideTab() {
  return (
    <div className="panel">
      <h2>Guide</h2>

      <div className="settings-section">
        <h3>RPE - Rate of Perceived Exertion</h3>
        <p className="muted">
          Logged 1-10 after each set. It's how close to failure that set was, not how heavy the weight
          felt on paper - rate it right after your last rep.
        </p>
        <table className="set-table">
          <thead>
            <tr>
              <th>RPE</th>
              <th>Means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10</td>
              <td>Could not do another rep</td>
            </tr>
            <tr>
              <td>9</td>
              <td>Maybe 1 more rep left</td>
            </tr>
            <tr>
              <td>8</td>
              <td>About 2 more reps left</td>
            </tr>
            <tr>
              <td>&le;7</td>
              <td>Comfortable - warm-up or light work</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="settings-section">
        <h3>How the weight suggestion decides</h3>
        <p className="muted">
          Every exercise has a target rep range (e.g. 8-12). After each session, the next suggestion is
          based on your last top set, checked against these rules in order:
        </p>
        <ol className="guide-list">
          <li>
            <strong>Deload</strong> - recovery was rated 2/5 or worse, or you've stalled two sessions in
            a row at a hard RPE. Weight drops about 15%.
          </li>
          <li>
            <strong>Hold</strong> - you missed the bottom of the rep range, or RPE averaged 9.5+. Same
            weight and rep target again.
          </li>
          <li>
            <strong>Increase weight</strong> - you hit the <em>top</em> of the rep range and RPE was 8 or
            under. Weight goes up by one increment, reps reset to the bottom of the range.
          </li>
          <li>
            <strong>Increase reps</strong> - anything else. Same weight, aim for one more rep.
          </li>
        </ol>
        <p className="muted">
          In short: weight only goes up once you've topped out your reps <em>with room to spare</em>.
          Topping out at a grinding RPE 9 holds instead - it has to feel earned, not maxed out.
        </p>
      </div>

      <div className="settings-section">
        <h3>Recovery rating</h3>
        <p className="muted">
          Logged once per session, 1 (wrecked) to 5 (fully recovered). A rating of 2 or below overrides
          everything else and suggests a deload, regardless of how the lifts themselves went.
        </p>
      </div>

      <div className="settings-section">
        <h3>PR badges</h3>
        <p className="muted">
          A set gets a PR badge when its weight beats every other weight you've ever logged for that
          exercise - converted to a common unit first if you've trained in both lb and kg.
        </p>
      </div>

      <div className="settings-section">
        <h3>Weight units</h3>
        <p className="muted">
          Each session remembers the unit it was actually logged in. Switching units in Settings never
          silently relabels old history - you'll be asked whether to convert everything or just start
          using the new unit going forward.
        </p>
      </div>

      <div className="settings-section">
        <h3>Your data</h3>
        <p className="muted">
          Everything lives only in this browser - there's no account and nothing syncs anywhere. Export
          a backup from Settings periodically, and definitely before clearing site data or switching
          devices.
        </p>
      </div>
    </div>
  )
}
