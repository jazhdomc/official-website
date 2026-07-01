package mc.jazhdo.website;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class SiteService {
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    // Pages
    private static LinkedHashMap<String, String> pagesOf(String... entries) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            map.put(entries[i], entries[i + 1]);
        }
        return map;
    }
    private static final Map<String, Map<String, String>> PAGES = new LinkedHashMap<>();
    static {
        PAGES.put("jazhdomc", pagesOf(
            "home", "html",
            "rules", "md",
            "staff", "html",
            "sources", "md",
            "moderator", "md",
            "changelog", "md",
            "error", "html"
        ));
    }

    // Hostnames & Sites
    private static final Map<String, String> HOSTNAMES = new LinkedHashMap<>();

    static {
        HOSTNAMES.put("mc.itsjaz.com", "jazhdomc");
        HOSTNAMES.put("localhost", "jazhdomc");
    }

    public String loadPage(String page, HttpServletRequest request, Model model) {
        return loadPage(page, request, model, false);
    }

    /**
     * Loads a specified page
     * 
     * @param page The name of the page to load
     * @param request A HttpServletRequest instance
     * @param model The page model
     * @return The dynamically built page's layout file
     */
    public String loadPage(String page, HttpServletRequest request, Model model, boolean throwError) {
        String site = HOSTNAMES.getOrDefault(request.getServerName(), "jazhdomc");

        Map<String, String> sitePages = PAGES.get(site);
        if (sitePages == null) {
            if (throwError) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found");
            else return loadErrorPage(404, "Site not found", request, model);
        }
        
        String type = sitePages.get(page);
        if (type == null) {
            if (throwError) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found");
            else return loadErrorPage(404, "Page not found", request, model);
        }
        
        String content;
        try {
            ClassPathResource resource = new ClassPathResource("templates/" + site + "/pages/" + page + "." + type);
            String raw = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            // Check for markdown
            if (type.equals("md")) {
                Node document = markdownParser.parse("# " + capitalize(page) + "\n" + raw);
                content = htmlRenderer.render(document);
            } else content = raw;
        } catch (IOException e) {
            if (throwError) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load page");
            else return loadErrorPage(500, "Could not load page", request, model);
        }

        // Get navigation menu and remove error page and paste in page
        Set<String> nav = new LinkedHashSet<>(sitePages.keySet());
        nav.remove("error");
        model.addAttribute("navLinks", nav);

        // Set content
        model.addAttribute("content", content);

        // Give current page a custom class
        model.addAttribute("currentPage", page);

        // Return the right layout file
        return site + "/layout";
    }

    private String loadErrorPage(Integer status, String errorMsg, HttpServletRequest request, Model model) {
        // Get layout with page
        String layout = loadPage("error", request, model, true);

        // Fill in status and error fields
        String content = (String) model.getAttribute("content");
        content = content.replace("{{status}}", String.valueOf(status != null ? status : 500));
        content = content.replace("{{error}}", errorMsg != null ? errorMsg : "An unknown error occurred.");
        
        // Save
        model.addAttribute("content", content);

        // Return finished page
        return layout;
    }

    /**
     * Capitalizes the first letter of a string
     * 
     * @param str The string to capitalize
     * @return The capitalized string
     */
    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
