function PageHero({ title, compact = false }) {
  return (
    <section className={`page-hero${compact ? ' page-hero-compact' : ''}`}>
      <h1>{title}</h1>
    </section>
  )
}

export default PageHero
