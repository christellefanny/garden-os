// Exercise the visible navigation, including the Calendar group entry point.
export async function navigateGarden(page, label) {
  const sidebar = page.getByRole('navigation', { name: 'Garden Atelier navigation' });
  if (label === 'Tasks' || label === 'Garden Journal') {
    const sections = page.getByRole('navigation', { name: 'Calendar sections' });
    if (!(await sections.isVisible())) await sidebar.getByRole('button', { name: 'Calendar', exact: true }).click();
    await sections.getByRole('button', { name: label, exact: true }).click();
  } else {
    await sidebar.getByRole('button', { name: label === 'Growing Calendar' ? 'Calendar' : label, exact: true }).click();
  }
}
