<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:sfdc="http://soap.sforce.com/2006/04/metadata"
		exclude-result-prefixes="sfdc">
  <xsl:param name="filename"></xsl:param>
  <xsl:output method="xml" version="1.0" encoding="UTF-8"
	      indent="yes" omit-xml-declaration="yes"/>
  <xsl:template match="/">
      <xsl:for-each select="sfdc:CustomObject/sfdc:fields/sfdc:fullName">
	<xsl:text>    </xsl:text><members>
	  <xsl:value-of select="substring-before($filename, '.object')"/>.<xsl:value-of select="." />
	</members>
	<xsl:text>
</xsl:text>
      </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
