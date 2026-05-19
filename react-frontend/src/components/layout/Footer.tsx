export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {year} H&K Brothers. All rights reserved.</p>
    </footer>
  );
};
