(() => {
  const section = document.querySelector('.features');
  if (!section) return;

  const buttons = [...section.querySelectorAll('.features__item h3 button')];
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
  const visual = section.querySelector('#feature-visual');
  const visualSlot = section.querySelector('.features__visual');
  const image = visual.querySelector('img');
  const caption = visual.querySelector('figcaption');
  const compact = window.matchMedia('(max-width: 1023px)');
  const assets = [
    { src: 'assets/images/features/marketing-suite.avif', width: 600, height: 423, alt: 'WellnessLiving Marketing Suite illustration with email and SMS automation panels', caption: 'Illustrative Marketing Suite view; on-screen figures are for illustration.' },
    { src: 'assets/images/features/voice-caasi-fitness.avif', width: 912, height: 692, alt: 'CAASI AI front desk conversation illustration', caption: 'CAASI product illustration', fallback: { src: 'assets/images/features/caasi-icon.avif', width: 81, height: 65, alt: 'CAASI feature icon from WellnessLiving', caption: 'CAASI product icon', icon: true, raster: true } },
    { src: 'assets/images/features/WL2.0-Family-management_3x1.avif', width: 936, height: 660, alt: 'Family account and registration illustration', caption: 'Family management product illustration', fallback: { src: 'assets/images/features/family-icon.svg', width: 25, height: 21, alt: 'Family management feature icon from WellnessLiving', caption: 'Family management icon', icon: true } },
    { src: 'assets/images/features/WL2.0-Custom-Branded-App-Pole-Dance_2x.avif', width: 1248, height: 880, alt: 'Custom branded dance studio app illustration', caption: 'Custom Branded App product illustration', fallback: { src: 'assets/images/features/branded-experience-icon.svg', width: 26, height: 23, alt: 'Branded Experience category icon from WellnessLiving', caption: 'Branded Experience icon', icon: true } },
    { src: 'assets/images/features/WL2.0-Reviews-Referrals-Rewards_2x-2.avif', width: 1248, height: 880, alt: 'WellnessLiving rewards and loyalty illustration', caption: 'Reviews, Referrals & Rewards product illustration; on-screen points are illustrative.', fallback: { src: 'assets/images/features/loyalty-icon.svg', width: 24, height: 21, alt: 'Reviews, referrals and rewards feature icon from WellnessLiving', caption: 'Reviews, Referrals & Rewards icon', icon: true } },
    { src: 'assets/images/features/presence-dance.avif', width: 1872, height: 1320, alt: 'WellnessLiving Presence dance website illustration', caption: '' }
  ];
  let active = -1;
  let shown = 0;

  const showAsset = asset => {
    image.src = asset.src;
    image.width = asset.width;
    image.height = asset.height;
    image.alt = asset.alt;
    caption.textContent = asset.caption;
    caption.hidden = !asset.caption;
    visual.classList.toggle('is-icon', Boolean(asset.icon));
    visual.classList.toggle('is-raster', Boolean(asset.raster));
  };

  const placeVisual = () => {
    if (compact.matches && active !== -1) panels[active].append(visual);
    else visualSlot.append(visual);
    visualSlot.hidden = compact.matches && active !== -1;
  };

  const select = index => {
    active = index === active ? -1 : (index + buttons.length) % buttons.length;
    buttons.forEach((button, i) => button.setAttribute('aria-expanded', String(i === active)));
    panels.forEach((panel, i) => { panel.hidden = i !== active; });
    if (active !== -1) {
      shown = active;
      showAsset(assets[shown]);
    }
    placeVisual();
  };

  image.addEventListener('error', () => {
    const fallback = assets[shown].fallback;
    if (fallback && image.getAttribute('src') === assets[shown].src) showAsset(fallback);
  });

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        select(index);
        return;
      }
      let next;
      if (event.key === 'ArrowDown') next = index + 1;
      else if (event.key === 'ArrowUp') next = index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      const target = (next + buttons.length) % buttons.length;
      if (target !== active) select(target);
      buttons[target].focus();
    });
  });

  compact.addEventListener('change', placeVisual);
  select(0);
})();
