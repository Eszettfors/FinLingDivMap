export default function AboutView() {
  return (
    <div className="about">
      <article className="about__card">
        <h3>About this dashboard</h3>
        <p>
          This dashboard was built to visualize the FinLingDiv dataset and allow exploration of how the linguistic
          diversity of Finland has changed across time and space from 1990 to 2025. 
        </p>
        <p>
          On the left hand side, you can select a measure to visualize. Dominant language shows the most widely spoken L1 in each municipality for a given year. 
          The intensity of the color indicates the magnitude of the proportion: a darker color corresponds to more dominance. The other measures summarize linguistic diversity according to 
          according to the Leinster–Cobbold framework (2012); for more detail, see Essfors (2025) below. In short: diversity is maximized when a municipality has many different languages which are evenly distributed.
          
        </p>

        <p>
          By clicking on a municipality on the map, you can view a visualization of either: the distribution of languages (treemap) or the change in diversity over time. The chosen visualization
          can be regulated by clicking the buttons under "Visualization" on the left hand side. There are two type of maps you can choose from using the "Map type" buttons: "Diversity measure" visualizes the magniuted of the selected diversity meaure;
          "Langage share" the proportion of speakers in a municipality for a selected language. To select a language, you can use the dropdown menu or serach for a language.
        </p>

        <h3>About the data</h3>
 
        <p>
          The data underlying the FinLingDiv dataset stems from the{" "}
          <a href="https://dvv.fi/en/population-information-system" target="_blank" rel="noreferrer">
            Finnish Population Information System
          </a>
          , recording each person's address and native language, allowing us
          to infer the linguistic composition of Finland's municipalities and, from that, to
          quantify changes in linguistic diversity.
          The source of the data is Statistics Finland, published under a Creative Commons
          Attribution 4.0 International license. 

          The dataset can be accessed through Zenodo:{" "}
          <a href="https://zenodo.org/records/18257720" target="_blank" rel="noreferrer">
            zenodo.org/records/18257720
          </a>
          .
        </p>
        <h3>Citing the dataset</h3>
        <p className="body about__citation">
          Essfors, H. (2026). FinLingDiv (1.0) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.18257720
        </p>
        <h3>Citing this page</h3>
        <p>
          This site is a static port of the {" "}
          <a href="https://f39e09-hannes-essfors.shinyapps.io/FinLingDiv/" target="_blank" rel="noreferrer">
            FinLingDiv Shiny dashboard.
          </a>{" "} using Claude Sonnet 5 for GitHub Pages. If you want to cite any information on the dashboard, please cite the dataset above. If you have any questions, please
          contact me at hannes.essfors@gmail.com.
        </p>
        

        <h3>Further readings</h3>
        <p className="about__reference">
          Essfors, H. (2025). Global linguistic diversity – Adapting the Leinster–Cobbold
          framework from ecology for humanities research. In T. Arnold, M. Fantoli, &amp; R. Ros
          (Eds.), <em>Anthology of Computers and the Humanities</em> (Vol. 3, pp. 653–669).
          Association for Computers and the Humanities.{" "}
          <a href="https://doi.org/10.63744/srhQaCwGo5mj" target="_blank" rel="noreferrer">
            doi.org/10.63744/srhQaCwGo5mj
          </a>
        </p>

      </article>
    </div>
  );
}
